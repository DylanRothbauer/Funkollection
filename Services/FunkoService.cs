using Funkollection.Data;
using Funkollection.Models;
using Microsoft.EntityFrameworkCore;

namespace Funkollection.Services
{
    public class FunkoService
    {
        private readonly ApplicationDbContext _context;

        public FunkoService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<FunkoPop>> GetAllPopsAsync()
        {
            return await _context.FunkoPops.ToListAsync();
        }
    }
}
