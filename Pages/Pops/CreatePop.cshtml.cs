using Funkollection.Data;
using Funkollection.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Funkollection.Pages.Pops
{
    public class CreatePopModel : PageModel
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IWebHostEnvironment _environment;

        public CreatePopModel(ApplicationDbContext context, UserManager<ApplicationUser> userManager, IWebHostEnvironment environment)
        {
            _context = context;
            _userManager = userManager;
            _environment = environment;
        }

        [BindProperty]
        public FunkoPop FunkoPop { get; set; }

        [BindProperty]
        public IFormFile ImageFile { get; set; }

        public IActionResult OnGet()
        {
            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            if (!ModelState.IsValid)
            {
                return Page();
            }

            string imageUrl = null;
            if (ImageFile != null)
            {
                string uploadsFolder = Path.Combine(_environment.WebRootPath, "images");
                string uniqueFileName = Guid.NewGuid().ToString() + "_" + ImageFile.FileName;
                string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await ImageFile.CopyToAsync(fileStream);
                }

                imageUrl = "/images/" + uniqueFileName; // Store relative path
            }

            var newFunko = new FunkoPop
            {
                Name = FunkoPop.Name,
                Number = FunkoPop.Number,
                Series = FunkoPop.Series,
                Title = FunkoPop.Title,
                ImageUrl = imageUrl // Save image URL
            };

            _context.FunkoPops.Add(newFunko);
            await _context.SaveChangesAsync();

            var userFunko = new UserFunkoPop
            {
                UserId = user.Id,
                FunkoPopId = newFunko.Id
            };

            _context.UserFunkoPops.Add(userFunko);
            await _context.SaveChangesAsync();

            return RedirectToPage("/Pops/MyCollection");
        }
    }
}
