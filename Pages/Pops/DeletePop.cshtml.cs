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

            // Remove the association between the user and the FunkoPop
            _context.UserFunkoPops.Remove(userFunko);

            // Check if the FunkoPop is associated with any other users
            var funkoPop = await _context.FunkoPops
                .Include(fp => fp.UserFunkoPops)
                .FirstOrDefaultAsync(fp => fp.Id == id);

            if (funkoPop != null && !funkoPop.UserFunkoPops.Any())
            {
                // If no other users are linked to this FunkoPop, delete it from the FunkoPop table
                _context.FunkoPops.Remove(funkoPop);
            }

            await _context.SaveChangesAsync();

            return RedirectToPage("/Pops/Collection");
        }

    }
}
