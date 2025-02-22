using Funkollection.Models;
using Funkollection.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Funkollection.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;
        //private readonly FunkoService funkoService;
        private readonly SignInManager<ApplicationUser> _signInManager;

        public IndexModel(ILogger<IndexModel> logger, SignInManager<ApplicationUser> signInManager)
        {
            _logger = logger;
            _signInManager = signInManager;
        }

        public void OnGet()
        {
            if (_signInManager.IsSignedIn(User))  // Checks if the user is logged in
            {
                // Redirect logged-in users to the Home page
                Response.Redirect("/Home");
            }
        }
    }
}
