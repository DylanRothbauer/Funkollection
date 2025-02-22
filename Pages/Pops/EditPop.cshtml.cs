using Funkollection.Data;
using Funkollection.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace Funkollection.Pages.Pops
{
    public class EditPopModel : PageModel
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<EditPopModel> _logger;

        public EditPopModel(ApplicationDbContext context, UserManager<ApplicationUser> userManager, ILogger<EditPopModel> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        [BindProperty]
        public FunkoPop FunkoPop { get; set; }

        public async Task<IActionResult> OnGetAsync(int id)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            // Find the user's FunkoPop
            var userFunko = await _context.UserFunkoPops
                .Include(ufp => ufp.FunkoPop)
                .FirstOrDefaultAsync(ufp => ufp.FunkoPopId == id && ufp.UserId == user.Id);

            if (userFunko == null)
            {
                return NotFound();
            }

            FunkoPop = userFunko.FunkoPop;
            return Page();
        }

        public async Task<IActionResult> OnPostAsync(int id)
        {
            _logger.LogInformation("OnPostAsync called for FunkoPop ID: {Id}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("ModelState is invalid.");
                foreach (var error in ModelState.Values.SelectMany(v => v.Errors))
                {
                    _logger.LogWarning("Error: {Message}", error.ErrorMessage);
                }
                return Page();
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                _logger.LogWarning("User not authenticated.");
                return Unauthorized();
            }

            // Retrieve the UserFunkoPop entry for the current user
            var userFunko = await _context.UserFunkoPops
                .Include(ufp => ufp.FunkoPop)
                .FirstOrDefaultAsync(ufp => ufp.FunkoPopId == id && ufp.UserId == user.Id);

            if (userFunko == null)
            {
                _logger.LogWarning("UserFunkoPop not found for FunkoPop ID: {Id}", id);
                return NotFound();
            }

            // Update the FunkoPop properties inside the UserFunkoPop
            userFunko.FunkoPop.Name = FunkoPop.Name;
            userFunko.FunkoPop.Series = FunkoPop.Series;
            userFunko.FunkoPop.Title = FunkoPop.Title;
            userFunko.FunkoPop.ImageUrl = FunkoPop.ImageUrl;
            userFunko.FunkoPop.Number = FunkoPop.Number;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Changes saved successfully.");
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError("Concurrency error: {Message}", ex.Message);
                return StatusCode(500, "A database error occurred.");
            }

            return RedirectToPage("/Pops/Collection");
        }



    }
}
