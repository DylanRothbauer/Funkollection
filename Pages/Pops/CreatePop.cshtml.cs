using Funkollection.Data;
using Funkollection.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Linq;

namespace Funkollection.Pages.Pops
{
    public class CreatePopModel : PageModel
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<CreatePopModel> _logger;

        [BindProperty]
        public FunkoPop FunkoPop { get; set; }

        [BindProperty]
        public IFormFile? ImageFile { get; set; }  // Optional image upload

        public CreatePopModel(ApplicationDbContext context, IWebHostEnvironment webHostEnvironment, UserManager<ApplicationUser> userManager, ILogger<CreatePopModel> logger)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
            _userManager = userManager;
            _logger = logger;
        }

        public IActionResult OnGet()
        {
            _logger.LogInformation("GET CreatePop page loaded.");
            return Page();
        }

        public async Task<IActionResult> OnPostCreateAsync()
        {
            _logger.LogInformation("OnPostCreateAsync started.");

            ModelState.Remove(nameof(ImageFile));

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Model state is invalid.");
                foreach (var error in ModelState.Values.SelectMany(v => v.Errors))
                {
                    _logger.LogWarning("Validation error: {ErrorMessage}", error.ErrorMessage);
                }
                return Page();
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                _logger.LogWarning("User not authenticated.");
                return Unauthorized();
            }
            _logger.LogInformation("User {UserId} authenticated successfully.", user.Id);

            var existingFunkoPop = await _context.FunkoPops
                .FirstOrDefaultAsync(fp => fp.Name == FunkoPop.Name && fp.Series == FunkoPop.Series);

            FunkoPop funkoPopToSave;

            if (existingFunkoPop != null)
            {
                _logger.LogInformation("Funko Pop '{FunkoPopName}' already exists. Redirecting with error message.", FunkoPop.Name);

                // Set error message and redirect to the Create page
                TempData["ErrorMessage"] = "This Funko Pop already exists!";
                return RedirectToPage("/Pops/CreatePop");
            }
            else
            {
                _logger.LogInformation("Funko Pop '{FunkoPopName}' does not exist. Creating a new entry.", FunkoPop.Name);
                funkoPopToSave = new FunkoPop
                {
                    Name = FunkoPop.Name,
                    Series = FunkoPop.Series,
                    Title = FunkoPop.Title,
                    Number = FunkoPop.Number
                };

                _context.FunkoPops.Add(funkoPopToSave);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Funko Pop '{FunkoPopName}' created successfully.", FunkoPop.Name);
            }

            string imageUrl = null;
            if (ImageFile != null)
            {
                _logger.LogInformation("Image file received. Uploading image.");
                var fileName = Path.GetFileNameWithoutExtension(ImageFile.FileName) + Guid.NewGuid().ToString() + Path.GetExtension(ImageFile.FileName);
                var filePath = Path.Combine(_webHostEnvironment.WebRootPath, "images", fileName);

                try
                {
                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await ImageFile.CopyToAsync(fileStream);
                    }
                    imageUrl = "/images/" + fileName;
                    _logger.LogInformation("Image uploaded successfully: {FilePath}", filePath);
                }
                catch (Exception ex)
                {
                    _logger.LogError("Error uploading image: {Message}", ex.Message);
                }
            }

            var userFunkoPop = new UserFunkoPop
            {
                UserId = user.Id,
                FunkoPopId = funkoPopToSave.Id,
                DateAcquired = DateTime.UtcNow,
                ImageUrl = imageUrl
            };

            _context.UserFunkoPops.Add(userFunkoPop);
            await _context.SaveChangesAsync();

            _logger.LogInformation("UserFunkoPop created successfully for user {UserId}.", user.Id);

            return RedirectToPage("/Pops/Collection");
        }
    }
}
