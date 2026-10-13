/**
 * petSound.ts
 * Tiện ích phát âm thanh tương tác thú cưng trên Landing page
 */

export function playPetSound(volume = 0.7) {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio("/sounds/pet-voice.mp3");
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;
    audio.play().catch((err) => {
      // Bỏ qua lỗi trình duyệt nếu user chưa tương tác hoặc chuyển trang
      console.debug("[PetSound] Không thể phát âm thanh:", err);
    });
  } catch (err) {
    console.debug("[PetSound] Khởi tạo âm thanh thất bại:", err);
  }
}
