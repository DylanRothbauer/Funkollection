namespace Funkollection.Models
{
    public class FunkoPopSticker
    {
        public int FunkoPopId { get; set; }
        public FunkoPop FunkoPop{ get; set; }
        public int StickerId { get; set; }
        public Sticker Sticker { get; set; }
    }
}
