namespace Funkollection.Models
{
    public class Sticker
    {
        public int Id { get; set; } // Primary key
        public string Name { get; set; }
        public ICollection<FunkoPopSticker> FunkoPopStickers { get; set; }
    }
}
