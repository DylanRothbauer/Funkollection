using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Funkollection.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddedImageForUserFunkoPop : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "UserFunkoPops",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "UserFunkoPops");
        }
    }
}
