namespace Funkollection.Models
{
    public class FunkoPop
    {
        public int Id { get; set; } // Primary Key
        public int Number { get; set; }
        public string Name { get; set; }
        public string? Series { get; set; }
        public string Title { get; set; }
        public string? ImageUrl { get; set; }
        public ICollection<Sticker>? Stickers { get; set; }
        public ICollection<FunkoPopSticker> FunkoPopStickers { get; set; }
        public ICollection<UserFunkoPop> UserFunkoPops {  get; set; }
    }
}
