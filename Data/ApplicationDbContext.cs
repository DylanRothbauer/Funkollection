using Funkollection.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Funkollection.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<FunkoPop> FunkoPops { get; set; }
        public DbSet<Sticker> Stickers { get; set; }
        public DbSet<FunkoPopSticker> FunkoPopStickers { get; set; }
        public DbSet<UserFunkoPop> UserFunkoPops { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Many-to-many relationship between FunkoPops and Stickers
            modelBuilder.Entity<FunkoPopSticker>()
                .HasKey(fps => new { fps.FunkoPopId, fps.StickerId });

            modelBuilder.Entity<FunkoPopSticker>()
                .HasOne(fps => fps.FunkoPop)
                .WithMany(fp => fp.FunkoPopStickers)
                .HasForeignKey(fps => fps.FunkoPopId);

            modelBuilder.Entity<FunkoPopSticker>()
                .HasOne(fps => fps.Sticker)
                .WithMany(s => s.FunkoPopStickers)
                .HasForeignKey(fps => fps.StickerId);

            // Many-to-many relationship between Users and FunkoPops
            modelBuilder.Entity<UserFunkoPop>()
                .HasKey(ufp => new { ufp.UserId, ufp.FunkoPopId });

            modelBuilder.Entity<UserFunkoPop>()
                .HasOne(ufp => ufp.User)
                .WithMany(u => u.UserFunkoPops)  // User can have many Funko Pops
                .HasForeignKey(ufp => ufp.UserId);

            modelBuilder.Entity<UserFunkoPop>()
                .HasOne(ufp => ufp.FunkoPop)
                .WithMany(fp => fp.UserFunkoPops)  // Funko Pop can be owned by many Users
                .HasForeignKey(ufp => ufp.FunkoPopId);
        }


    }
}
