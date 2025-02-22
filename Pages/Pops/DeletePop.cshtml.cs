using Funkollection.Data;
using Funkollection.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Funkollection.Pages.Pops
{
    public class DeletePopModel : PageModel
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public DeletePopModel(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
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
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            var userFunko = await _context.UserFunkoPops
                .FirstOrDefaultAsync(ufp => ufp.FunkoPopId == id && ufp.UserId == user.Id);

            if (userFunko == null)
            {
                return NotFound();
            }

            // Remove the association (not the FunkoPop itself)
            _context.UserFunkoPops.Remove(userFunko);
            await _context.SaveChangesAsync();

            return RedirectToPage("/Pops/MyCollection");
        }
    }
}
