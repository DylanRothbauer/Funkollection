using Funkollection.Models;
using Funkollection.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace Funkollection.Pages.Pops
{
    public class EditPopModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public EditPopModel(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [BindProperty]
        public FunkoPop FunkoPop { get; set; }

        public async Task<IActionResult> OnGetAsync(int id)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return RedirectToPage("/Account/Login");
            }

            // Fetch the FunkoPop to be edited
            FunkoPop = await _context.FunkoPops
                .Where(f => f.Id == id)
                .Include(f => f.Stickers)
                .FirstOrDefaultAsync();

            if (FunkoPop == null || !await _context.UserFunkoPops.AnyAsync(u => u.UserId == user.Id && u.FunkoPopId == id))
            {
                return RedirectToPage("/Pops/MyCollection"); // Redirect if the FunkoPop doesn't exist or isn't the user's
            }

            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return RedirectToPage("/Account/Login");
            }

            if (ModelState.IsValid)
            {
                // Update the FunkoPop
                _context.Attach(FunkoPop).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return RedirectToPage("/Pops/MyCollection");
            }

            return Page();
        }
    }
}
