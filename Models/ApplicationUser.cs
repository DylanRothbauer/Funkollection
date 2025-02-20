using Microsoft.AspNetCore.Identity;

namespace Funkollection.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? DisplayName { get; set; }  // Custom property
        public DateTime DateJoined { get; set; } = DateTime.UtcNow; // New users get a timestamp
        public ICollection<UserFunkoPop> UserFunkoPops { get; set; } // (many to many relationship)
    }
}
