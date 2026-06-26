<template>
  <footer class="footer-neo">
    <div class="footer-container">
      <div>
        <div class="footer-brand">BARTERYUK</div>
        <p class="footer-copy">© 2026 BarterYuk. Made By Laras-233510656. Semua hak cipta dilindungi.</p>
      </div>
      <div class="footer-links">
        <div>
          <h4>Platform</h4>
          <ul>
            <li><a href="#">Ketentuan Layanan</a></li>
            <li><a href="#">Kebijakan Privasi</a></li>
            <li><a href="#">Pusat Bantuan</a></li>
          </ul>
        </div>
        <div>
          <h4>Social</h4>
          <ul>
            <li><a href="#">Instagram</a></li>
            <li><a href="#">Twitter / X</a></li>
            <li><a href="#">TikTok</a></li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-neo {
  border-top: 4px solid black;
  background: #9d1b58;
  color: white;
  padding: 2rem 1.5rem;
  margin-top: 3rem;
}
.footer-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}
.footer-brand {
  font-family: 'Inter', sans-serif;
  font-style: italic;
  font-size: 2rem;
  font-weight: 900;
  color: #ffd700;
}
.footer-copy {
  font-size: 0.85rem;
  opacity: 0.8;
}
.footer-links {
  display: flex;
  gap: 3rem;
}
.footer-links h4 {
  color: #ffd700;
  font-weight: 900;
  margin: 0 0 0.5rem;
}
.footer-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.footer-links li {
  margin-bottom: 0.3rem;
}
.footer-links a {
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
}
.footer-links a:hover {
  text-decoration: underline;
  color: #ffd700;
}
</style>