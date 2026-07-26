export default function SuccessOrder() {
    const query_params:URLSearchParams = new URLSearchParams(window.location.search) // Gets The Query Params
    const tracking_code:string|null = query_params.get("code") || null // Gets The Tracking Code

    return (
        <div className="success_container">
            <div className="success">
                <div className="icon">
                    <i className={`fa-solid ${tracking_code ? "fa-check" : "fa-xmark"}`}></i> {/* https://fontawesome.com/icons/check / https://fontawesome.com/icons/xmark */}
                </div>

                {tracking_code && (
                    <div>
                        <h1>Objednávka bola prijatá!</h1>
                        <h2 className="tracking_code">Kód: {tracking_code}</h2>
                        <p>Ďakujeme za tvoju objednávku. Naši kuchári sa už pustili do práce a tvoje jedlo bude čoskoro na ceste.</p>
                    </div>
                )}

                {!tracking_code && (
                    <div>
                        <h1>Neexistujúca objednávka!</h1>
                        <p>Túto objednávku nie je možné nájsť.</p>
                    </div>
                )}
                
                <div className="buttons">
                    {tracking_code && (<a className="track_order" href={`objednavka/${tracking_code}`}>Sledovať objednávku</a>)}
                    <a className="back" href="/">Späť domov</a>
                </div>
            </div>
        </div>
    )
}