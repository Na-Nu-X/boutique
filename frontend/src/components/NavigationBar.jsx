import "./NavigationBar.scss"

export default function NavigationBar() {
  return (
    <nav className="navigation_bar">
      <h2 className="logo">Butik</h2>
      
      <ul className="links">
        <li>
          <a href="/" aria-label="Domov">Domov</a>
        </li>

        <li>
          <a href="/produkty" aria-label="Produkty">Produkty</a>
        </li>

        <li>
          <a href="/kontakt" aria-label="Kontakt">Kontakt</a>
        </li>
      </ul>

      <div className="cart">
        <p className="amount">0</p>

        <button className="show_cart" title="Zobraziť košík" aria-label="Zobraziť košík">
          <i className="fa-solid fa-basket-shopping"></i> {/* https://fontawesome.com/icons/basket-shopping */}
        </button>
      </div>
    </nav>
  )
}