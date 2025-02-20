using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Funkollection.Data.Migrations
{
    /// <inheritdoc />
    public partial class Addedtables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DateJoined",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FunkoPops",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Series = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FunkoPops", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Stickers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FunkoPopId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stickers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Stickers_FunkoPops_FunkoPopId",
                        column: x => x.FunkoPopId,
                        principalTable: "FunkoPops",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserFunkoPops",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FunkoPopId = table.Column<int>(type: "int", nullable: false),
                    DateAcquired = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFunkoPops", x => new { x.UserId, x.FunkoPopId });
                    table.ForeignKey(
                        name: "FK_UserFunkoPops_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserFunkoPops_FunkoPops_FunkoPopId",
                        column: x => x.FunkoPopId,
                        principalTable: "FunkoPops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FunkoPopStickers",
                columns: table => new
                {
                    FunkoPopId = table.Column<int>(type: "int", nullable: false),
                    StickerId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FunkoPopStickers", x => new { x.FunkoPopId, x.StickerId });
                    table.ForeignKey(
                        name: "FK_FunkoPopStickers_FunkoPops_FunkoPopId",
                        column: x => x.FunkoPopId,
                        principalTable: "FunkoPops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FunkoPopStickers_Stickers_StickerId",
                        column: x => x.StickerId,
                        principalTable: "Stickers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FunkoPopStickers_StickerId",
                table: "FunkoPopStickers",
                column: "StickerId");

            migrationBuilder.CreateIndex(
                name: "IX_Stickers_FunkoPopId",
                table: "Stickers",
                column: "FunkoPopId");

            migrationBuilder.CreateIndex(
                name: "IX_UserFunkoPops_FunkoPopId",
                table: "UserFunkoPops",
                column: "FunkoPopId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FunkoPopStickers");

            migrationBuilder.DropTable(
                name: "UserFunkoPops");

            migrationBuilder.DropTable(
                name: "Stickers");

            migrationBuilder.DropTable(
                name: "FunkoPops");

            migrationBuilder.DropColumn(
                name: "DateJoined",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "DisplayName",
                table: "AspNetUsers");
        }
    }
}
