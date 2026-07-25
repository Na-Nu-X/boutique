// @ts-ignore
import "./SuccessPayment.scss"

export default function SuccessPayment() {
    const query_params:URLSearchParams = new URLSearchParams(window.location.search) // Gets The Query Params
    const tracking_code:string|null = query_params.get("tracking_code") || null // Gets The Tracking Code

    return (
        <div className="success_container">
            <div className="success">
                <div className="icon"><i className="fa-solid fa-check"></i></div> {/* https://fontawesome.com/icons/check */}
                <h1>Platba prebehla úspešne!</h1>
                <h2 className="tracking_code">Kód: {tracking_code}</h2>
                <p>Ďakujeme za tvoju objednávku. Naši kuchári sa už pustili do práce a tvoje jedlo bude čoskoro na ceste.</p>
                
                <div className="buttons">
                    <a className="track_order" href={`objednavka?tracking_code=${tracking_code}`}>Sledovať objednávku</a>
                    <a className="back" href="/">Späť domov</a>
                </div>
            </div>
        </div>
    )
}