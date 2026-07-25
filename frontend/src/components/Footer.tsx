// @ts-ignore
import "./Footer.scss"
// @ts-ignore
import visa from "../assets/visa.png"
// @ts-ignore
import mastercard from "../assets/mastercard.png"
// @ts-ignore
import amex from "../assets/amex.png"
// @ts-ignore
import discover from "../assets/discover.png"
// @ts-ignore
import diners_club from "../assets/diners_club.png"
// @ts-ignore
import jcb from "../assets/jcb.png"

export default function Footer() {
    return (
        <footer>
            <h2>Butik</h2>

            <div className="address">
                <p>Mlynské nivy 5/A</p>
                <p>821 08 Bratislava</p>
            </div>

            <div className="contact_us">
                <p><i className="fa-regular fa-envelope"></i> <a href="mailto:behulpatrik@gmail.com" title="Napísať...">behulpatrik@gmail.com</a></p> {/* https://fontawesome.com/icons/envelope */}
                <p><i className="fa-solid fa-phone"></i> <a href="tel:+421940322633" title="Zavolať...">+421 940 322 633</a></p> {/* https://fontawesome.com/icons/phone */}
            </div>

            <div className="social_media">
                <a href="https://www.instagram.com/" title="Instagram" target="_blank"><i className="fa-brands fa-instagram"></i></a> {/* https://fontawesome.com/icons/instagram */}
                <a href="https://www.facebook.com/" title="Facebook" target="_blank"><i className="fa-brands fa-facebook"></i></a> {/* https://fontawesome.com/icons/facebook */}
                <a href="https://www.tiktok.com/" title="TikTok" target="_blank"><i className="fa-brands fa-tiktok"></i></a> {/* https://fontawesome.com/icons/tiktok */}
            </div>

            <div className="payment_methods">
                <div className="icons">
                    <img src={visa} title="Visa" alt="Visa" /> {/* https://www.flaticon.com/free-icon/visa_5968299 */}
                    <img src={mastercard} title="Mastercard" alt="Mastercard" /> {/* https://www.flaticon.com/free-icon/card_16174534 */}
                    <img src={amex} title="American Express" alt="American Express" /> {/* https://www.flaticon.com/free-icon/amex_179431 */}
                    <img src={discover} title="Discover" alt="Discover" /> {/* https://www.flaticon.com/free-icon/discover_349230 */}
                    <img src={diners_club} title="Diners Club" alt="Diners Club" /> {/* https://www.flaticon.com/free-icon/diners-club_229142 */}
                    <img src={jcb} title="JCB" alt="JCB" /> {/* https://www.flaticon.com/free-icon/jcb_196559 */}
                </div>
            </div>
            
            <div className="other">
                <p className="copywrite">&copy; Butik 2026, Všetky práva vyhradené.</p>
            </div>
        </footer>
    )
}