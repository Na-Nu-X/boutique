// @ts-ignore
import "./ContactForm.scss"
import { useState } from "react"

interface ContactMessage {
    first_name:string,
    last_name:string,
    email_address:string,
    message:string
}

interface ContactResponse {
    success:boolean,
    message:string
}

const BACKEND_URL = "http://localhost:5000" // Defines The Back-End URL

export default function ContactForm() {
    // Sets The Contact Form
    const [contact_form, setContactForm] = useState<ContactMessage>(() => {
        return {
            first_name: "",
            last_name: "",
            email_address: "",
            message: ""
        }
    })

    // Function For Handle The Contact Form Input Change
    const handleInputChange = (event:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
        const { name, value } = event.target // Gets The Name And Value Of Input

        setContactForm((previous_contact_form) => ({
            ...previous_contact_form, // Copies All Other Form Data
            [name]: value, // Updates The Changed Value
        }))
    }

    // Function For Send The Message
    const sendMessage = async (event:React.FormEvent) => {
        event.preventDefault() // Prevents The Default Behaviour

        // If The Contact Form Isn't Filled
        if (
            !contact_form.first_name.trim() ||
            !contact_form.last_name.trim() ||
            !contact_form.email_address.trim() ||
            !contact_form.message.trim()
        ) {
            alert("Prosím, vyplňte všetky povinné kontaktné údaje pre odoslanie správy.") // Shows The Alert
            return
        }

        try {
            // Sends The Message
            const response:Response = await fetch(`${BACKEND_URL}/api/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contact_form)
            })
      
            const contact_response:ContactResponse = await response.json() // Gets The Response Data
      
            if(contact_response && contact_response.success) {
                alert(contact_response.message) // Shows The Alert

                // Clears The Form
                setContactForm({
                    first_name: "",
                    last_name: "",
                    email_address: "",
                    message: ""
                })
            }
      
            else {
              console.error(contact_response.message) // Shows The Error Message
            }
        }
          
        catch(error) {
            console.error(error) // Shows The Error
            alert("Pri odosielaní správy došlo k chybe.") // Shows The Alert
        }
    }

    return (
        <form className="contact_form" action="" onSubmit={sendMessage}>
            <div className="name_container">
                <input 
                    type="text" 
                    name="first_name" 
                    placeholder="Meno" 
                    max-length="20" 
                    required 
                    value={contact_form.first_name}
                    onChange={handleInputChange}
                />

                <input 
                    type="text" 
                    name="last_name" 
                    placeholder="Priezvisko" 
                    max-length="50" 
                    required 
                    value={contact_form.last_name}
                    onChange={handleInputChange}
                />
            </div>

            <input 
                type="email" 
                name="email_address" 
                placeholder="E-mail" 
                max-length="50" 
                required 
                value={contact_form.email_address}
                onChange={handleInputChange}
            />

            <textarea 
                name="message" 
                placeholder="Správa..." 
                rows={5}
                max-length="250"
                required
                value={contact_form.message || ""}
                onChange={handleInputChange}
            >
            </textarea>

            <button type="submit" className="send">Odoslať správu</button>
        </form>
    )
}