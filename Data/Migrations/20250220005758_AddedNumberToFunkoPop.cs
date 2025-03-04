﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Funkollection.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddedNumberToFunkoPop : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Number",
                table: "FunkoPops",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Number",
                table: "FunkoPops");
        }
    }
}
