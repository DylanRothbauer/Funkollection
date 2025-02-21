using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Funkollection.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using Funkollection.Data;

namespace Funkollection.Services
{
    public static class DbSeeder
    {
        public static async Task SeedData(IServiceProvider serviceProvider, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            using (var scope = serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                // Ensure database is created
                context.Database.EnsureCreated();

                // Ensure roles exist
                var roleName = "User";
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }

                // Check if the user exists
                var userEmail = "user@example.com";
                var user = await userManager.FindByEmailAsync(userEmail);

                if (user == null)
                {
                    // Create user
                    user = new ApplicationUser
                    {
                        UserName = userEmail,
                        Email = userEmail,
                        EmailConfirmed = true // Ensure email is confirmed
                    };

                    var result = await userManager.CreateAsync(user, "Password123!");
                    if (!result.Succeeded)
                    {
                        throw new Exception("Failed to create user.");
                    }

                    // Assign user to the "User" role
                    await userManager.AddToRoleAsync(user, roleName);
                }

                // Seed Funko Pops if not already in the database
                var funkoPop1 = context.FunkoPops.FirstOrDefault(fp => fp.Name == "Batman Funko Pop");
                var funkoPop2 = context.FunkoPops.FirstOrDefault(fp => fp.Name == "Iron Man Funko Pop");

                if (funkoPop1 == null)
                {
                    funkoPop1 = new FunkoPop
                    {
                        Number = 1,
                        Name = "Batman Funko Pop",
                        Title = "DC Superheroes",
                        Series = "Batman",
                        ImageUrl = "https://example.com/images/batman.jpg"
                    };
                    context.FunkoPops.Add(funkoPop1);
                }

                if (funkoPop2 == null)
                {
                    funkoPop2 = new FunkoPop
                    {
                        Number = 2,
                        Name = "Iron Man Funko Pop",
                        Title = "Marvel Avengers",
                        Series = "Iron Man",
                        ImageUrl = "https://example.com/images/ironman.jpg"
                    };
                    context.FunkoPops.Add(funkoPop2);
                }

                await context.SaveChangesAsync();

                // Seed the joint table UserFunkoPop
                if (!context.UserFunkoPops.Any(ufp => ufp.UserId == user.Id && ufp.FunkoPopId == funkoPop1.Id))
                {
                    context.UserFunkoPops.Add(new UserFunkoPop
                    {
                        UserId = user.Id,
                        FunkoPopId = funkoPop1.Id,
                        DateAcquired = DateTime.UtcNow
                    });
                }

                if (!context.UserFunkoPops.Any(ufp => ufp.UserId == user.Id && ufp.FunkoPopId == funkoPop2.Id))
                {
                    context.UserFunkoPops.Add(new UserFunkoPop
                    {
                        UserId = user.Id,
                        FunkoPopId = funkoPop2.Id,
                        DateAcquired = DateTime.UtcNow
                    });
                }

                await context.SaveChangesAsync();
            }
        }
    }
}
