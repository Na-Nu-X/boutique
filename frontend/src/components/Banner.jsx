import "./Banner.scss"
import image_1 from "../assets/image_1.jpg"

export default function Banner() {
  return (
    <div className="banner">
        <div className="text">
            <h1>Môj Butik</h1>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Sed, minus.</p>
        </div>

        <div className="image">
            <img src={image_1} alt="Obrázok" />
        </div>
    </div>
  )
}