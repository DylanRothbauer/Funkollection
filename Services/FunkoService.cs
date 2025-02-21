using Funkollection.Data;
using Funkollection.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Funkollection.Services
{
    public class FunkoService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public FunkoService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // Fetch all Funko Pops
        public async Task<List<FunkoPop>> GetAllPopsAsync()
        {
            return await _context.FunkoPops.ToListAsync();
        }

        // Fetch Funko Pops associated with the current user
        public async Task<List<FunkoPop>> GetUserPopsAsync(string userId)
        {
            var userPops = await _context.UserFunkoPops
                .Where(ufp => ufp.UserId == userId)
                .Include(ufp => ufp.FunkoPop)
                .Select(ufp => ufp.FunkoPop)
                .ToListAsync();

            return userPops;
        }

        // Example of creating an association between a user and a Funko Pop
        public async Task AddFunkoPopForUserAsync(string userId, FunkoPop funkoPop)
        {
            var userFunkoPop = new UserFunkoPop
            {
                UserId = userId,
                FunkoPopId = funkoPop.Id,
                DateAcquired = DateTime.Now
            };

            _context.UserFunkoPops.Add(userFunkoPop);
            await _context.SaveChangesAsync();
        }
    }
}
