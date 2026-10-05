export default function handler(req, res) {
  // Avtomatik kirish (guest) butunlay o'chirildi
  return res.status(401).json({
    success: false,
    error: 'Avtomatik kirish yopiq. Iltimos, login va parol orqali kiring.',
  });
}
