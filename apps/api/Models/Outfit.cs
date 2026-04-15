using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OotdPlatform.Api.Models
{
    public class Outfit
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        // 之後會由 Gemini 辨識後填入的標籤
        public string[] Tags { get; set; } = Array.Empty<string>();
    }
}