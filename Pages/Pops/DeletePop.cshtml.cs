using Funkollection.Models;
using Funkollection.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Identity;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Funkollection.Pages.Pops
{
    public class DeletePopModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public DeletePopModel(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
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

            // Fetch the FunkoPop to delete
            FunkoPop = await _context.FunkoPops
                .Where(f => f.Id == id)
                .FirstOrDefaultAsync();

            if (FunkoPop == null || !await _context.UserFunkoPops.AnyAsync(u => u.UserId == user.Id && u.FunkoPopId == id))
            {
                return RedirectToPage("/Pops/MyCollection"); // Redirect if the FunkoPop doesn't exist or isn't the user's
            }

            return Page();
        }

        public async Task<IActionResult> OnPostAsync(int id)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return RedirectToPage("/Account/Login");
            }

            var userFunkoPop = await _context.UserFunkoPops
                .Where(u => u.UserId == user.Id && u.FunkoPopId == id)
                .FirstOrDefaultAsync();

            if (userFunkoPop != null)
            {
                _context.UserFunkoPops.Remove(userFunkoPop);
                await _context.SaveChangesAsync();
            }

            return RedirectToPage("/Pops/MyCollection");
        }
    }
}
