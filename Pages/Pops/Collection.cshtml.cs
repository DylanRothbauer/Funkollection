using Funkollection.Models;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Funkollection.Data;

namespace Funkollection.Pages
{
    public class CollectionModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public CollectionModel(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        public IList<FunkoPop> FunkoPops { get; set; }

        public async Task OnGetAsync()
        {
            var user = await _userManager.GetUserAsync(User);

            // Fetch the FunkoPops related to the user
            FunkoPops = await _context.UserFunkoPops
                .Where(u => u.UserId == user.Id)
                .Include(u => u.FunkoPop) // Include the FunkoPop details
                .ThenInclude(p => p.Stickers) // Include stickers related to each FunkoPop
                .Select(u => u.FunkoPop)
                .ToListAsync();
        }
    }
}
