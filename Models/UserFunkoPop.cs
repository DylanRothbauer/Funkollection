namespace Funkollection.Models
{
    public class UserFunkoPop
    {
        // Foreign key to User (ApplicationUser)
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }

        // Foreign key to FunkoPop
        public int FunkoPopId { get; set; }
        public FunkoPop FunkoPop { get; set; }

        public DateTime DateAcquired { get; set; }
    }
}
