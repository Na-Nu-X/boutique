const express = require("express")
const cors = require("cors")
const { PrismaClient } = require("@prisma/client")

const app = express()

const Stripe = require("stripe")
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

const nodemailer = require("nodemailer")

const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static("uploads")) // Defines The Image Upload Path

// Gets The Status
app.post("/api/get-status", async (req, res) => {
  try {
    const config = await prisma.boutiqueConfig.findFirst() // Gets The Global Config

    if(config && config.is_force_closed) {
      return res.status(200).json({
        success: true,
        message: "Stav podniku bol úspešne získaný.",
        is_open: false,
        status: "Mimoriadne zatvorené",
        reason: config.closure_reason || "Dôvod nebol uvedený."
      })
    }

    const now = new Date() // Gets The Current Time
    let current_day_index = now.getDay() // Gets The Current Day Index

    if(current_day_index === 0) current_day_index = 7

    // Gets The "HH:MM" Time Format (For Example: "15:45")
    const current_time = now.toLocaleTimeString("sk-SK", { 
      hour: "2-digit", 
      minute: "2-digit", 
      hour12: false 
    })

    // Gets The Opening Hour For The Current Day
    const opening_hour = await prisma.openingHour.findUnique({
      where: { day_of_week: current_day_index }
    })

    if(!opening_hour) {
      return res.status(200).json({
        success: true,
        message: "Stav podniku bol úspešne získaný.",
        is_open: false,
        status: "Zatvorené",
        reason: "Neboli zadané otváracie hodiny."
      })
    }

    if(opening_hour.is_closed_all_day) {
      return res.status(200).json({
        success: true,
        message: "Stav podniku bol úspešne získaný.",
        is_open: false,
        status: "Zatvorené",
        reason: "Pravidelný zatvárací deň."
      })
    }

    const open_time = opening_hour.open_time // Gets The Open Time
    const close_time = opening_hour.close_time // Gets The Close Time

    const is_inside_opening_hours = current_time >= open_time && current_time <= close_time // Checks If The Current Time Is In Opening Hours

    if(is_inside_opening_hours) {
      return res.status(200).json({
        success: true,
        message: "Stav podniku bol úspešne získaný.",
        is_open: true,
        status: "Otvorené",
        reason: null,
        open_till: close_time
      })
    } 
    
    else {
      return res.status(200).json({
        success: true,
        message: "Stav podniku bol úspešne získaný.",
        is_open: false,
        status: "Zatvorené",
        reason: "Mimo otváracích hodín.",
        next_open: current_time
      })
    }
  } 
  
  catch (error) {
    console.error(error) // Shows The Error

    return res.status(500).json({
      success: false,
      message: "Pri získavaní stavu podniku došlo k chybe."
    })
  }
})

// Gets All The Clothing From The DB
app.get("/api/clothing", async(req, res) => {
  try {
    // Gets All The Clothing
    const clothing = await prisma.clothing.findMany({
      include: {
        category: true,
        ratings: true,

        modifier_groups: {
          include: {
            items: true
          }
        }
      }
    })

    // Creates Valid Format Of Clothing For JSON Response
    const clothing_data = clothing.map((one_clothing) => {
      const rating_amount = one_clothing.ratings.length // Gets The Rating Amount
      let average_rating = 0 // Stores The Average Rating
      
      if(rating_amount > 0) {
        const sum = one_clothing.ratings.reduce((total, current) => total + current.rating, 0) // Counts The Sum Of Ratings
        average_rating = Math.round((sum / rating_amount) * 10) / 10 // Gets The Average Rating
      }

      // Stores The Modifier Groups Data
      const modifier_groups_data = one_clothing.modifier_groups.map((group) => {
        return {
          id: group.id,
          title: group.title,
          is_multiple_choice: group.is_multiple_choice,
          is_required: group.is_required,

          items: group.items.map((item) => ({
            id: item.id,
            title: item.title,
            extra_price: item.extra_price
          }))
        }
      })

      return {
        id: one_clothing.id,
        title: one_clothing.title,
        description: one_clothing.description,
        category_id: one_clothing.categoryId || undefined, // Zmeníme categoryId na category_id
        price: one_clothing.price,
        image: one_clothing.image,
        average_rating: average_rating,
        rating_amount: rating_amount,
        modifier_groups: modifier_groups_data,
        selected_modifiers: {}
      }
    })

    // Sends The Data As A JSON Response
    return res.status(200).json({
      success: true,
      message: "Položky boli nájdené.",
      clothing: clothing_data
    })
  }
  
  catch(error) {
    console.error(error) // Shows The Error

    return res.status(500).json({
      success: false,
      message: "Pri načítaní položiek došlo k chybe."
    })
  }
})

// Gets All The Cart Items From The DB
app.post("/api/cart-items", async(req, res) => {
  try {
    const { ids } = req.body // Gets The Array Of Item IDs

    // If No Items Are Selected
    if(!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenašli sa žiadne položky."
      })
    }

    // Gets All The Clothing Which Is In Cart
    const clothing = await prisma.clothing.findMany({
      where: {
        id: { in: ids }
      }
    })

    // Sends The Data As A JSON Response
    return res.status(200).json({
      success: true,
      message: "Položky boli nájdené.",
      clothing: clothing
    })
  } 
  
  catch(error) {
    console.error(error) // Shows The Error

    return res.status(500).json({
      success: false,
      message: "Pri načítaní položiek došlo k chybe."
    })
  }
})

// Function For Check If The Boutique Is Open
async function isOpen() {
  try {
    const config = await prisma.boutiqueConfig.findFirst() // Gets The Global Config

    if(config && config.is_force_closed) return false

    const now = new Date() // Gets The Current Time
    let current_day_index = now.getDay() // Gets The Current Day Index

    if(current_day_index === 0) current_day_index = 7

    // Gets The "HH:MM" Time Format (For Example: "15:45")
    const current_time = now.toLocaleTimeString("sk-SK", { 
      hour: "2-digit", 
      minute: "2-digit", 
      hour12: false 
    })

    // Gets The Opening Hour For The Current Day
    const opening_hour = await prisma.openingHour.findUnique({
      where: { day_of_week: current_day_index }
    })

    if(!opening_hour || opening_hour.is_closed_all_day) return false

    const open_time = opening_hour.open_time // Gets The Open Time
    const close_time = opening_hour.close_time // Gets The Close Time
    const is_inside_opening_hours = current_time >= open_time && current_time <= close_time // Checks If The Current Time Is In Opening Hours

    return is_inside_opening_hours ? true : false
  } 
  
  catch(error) {
    console.error(error) // Shows The Error
    return false
  }
}

// Creates The Checkout Session
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    // Checks The Opening Hours

    // Checks If The Boutique Is Open
    if(!isOpen()) {
      return res.status(400).json({
        success: false,
        message: "Objednávky nie je možné uskutočniť, keď je zatvorené."
      })
    }

    // Gets The Data

    const is_local = process.env.IS_LOCAL === "True" // Gets The Information About Local Development
    const front_end_domain = process.env.FRONT_END_DOMAIN_URL || "http://localhost:5173/" // Gets The Front-End Domain URL

    const items = req.body.cart_items || [] // Gets The Items
    const tip_amount = parseInt(req.body.tip_amount || "0", 10)
    const customer = req.body.customer || {} // Gets The Customer
    const coupon_code = req.body.applied_coupon || null // Gets The Coupon Code

    // Calculates The Price

    let discount_percent = 0 // Stores The Discount Percent

    if(coupon_code) {
      // Gets The Active Coupon
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: { equals: coupon_code.trim(), mode: "insensitive" }, // Ignoruje veľkosť písmen (iexact)
          is_active: true
        }
      })

      if(coupon && (!coupon.valid_until || coupon.valid_until > new Date())) {
        discount_percent = coupon.discount_percent // Sets The Discount Percent
      }
    }

    let raw_items_price = 0 // Stores The Price In Cents Without The Discount

    for(const one_item of items) {
      const item_price = parseInt(one_item.price || "0", 10) // Gets The Item Price
      const item_quantity = parseInt(one_item.quantity || "1", 10) // Gets The Item Quantity

      raw_items_price += item_price * item_quantity 
    }

    const discount_amount = discount_percent > 0 ? Math.floor(raw_items_price * (discount_percent / 100)) : 0 // Stores The Discount Amount
    const discounted_items_price = raw_items_price - discount_amount // Stores The Discounted Items Price
    const total_price = discounted_items_price + tip_amount // Gets The Total Price In Cents (Clothing After Discount + Tip)

    // Processes The Order

    if(!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Platbu nie je možné uskutočniť bez položiek v košíku."
      })
    }

    const line_items = [] // Stores All Items
    const order_items = [] // Stores The DB Order Items

    const discount_multiplier = discount_percent > 0 ? (100 - discount_percent) / 100 : 1.0 // Gets The Discount Multiplayer (10% = 0.9)

    for(const one_item of items) {
      let image_name = one_item.image || "" // Gets The Image Name
      const item_id = parseInt(one_item.id, 10) // Gets The Item ID
      const original_unit_price = parseInt(one_item.price || "0", 10) // Gets The Original Price
      const quantity = parseInt(one_item.quantity || "1", 10) // Gets The Quantity

      let image_url = "" // Stores The Image URL

      if(is_local) {
        const title = one_item.title || "clothing" // Gets The Title
        const safe_title = encodeURIComponent(title) // Creates The Clear Title

        image_url = `https://dummyimage.com/600x400/fdc152/fff?text=${safe_title}` // Generates Random Image
      } 
      
      else {
        if(image_name.startsWith("http://") || image_name.startsWith("https://")) image_url = image_name // Sets The Image URL
        
        else {
          const domain = process.env.DOMAIN_URL || "localhost:8001" // Gets The Domain
          const clean_domain = domain.replace("http://", "").replace("https://", "").replace(/\/$/, "") // Cleans The Domain

          if(!image_name.startsWith("/")) image_name = `/${image_name}` // Gets The Image Name

          image_url = `https://${clean_domain}${image_name}` // Sets The Image URL
        }
      }

      const final_unit_price = Math.round(original_unit_price * discount_multiplier) // Applies The Discount On The Clothing

      line_items.push({
        price_data: {
          currency: "eur",

          product_data: {
            name: one_item.title || "clothing",
            images: [image_url]
          },

          unit_amount: Math.max(final_unit_price, 0)
        },

        quantity: Math.max(quantity, 1)
      })

      // Stores The New Order Item
      order_items.push({
        clothing_id: item_id,
        quantity: quantity,
        price_at_purchase: final_unit_price,
        is_tip: false
      })
    }

    // Adds The Tip To The Payment
    if(tip_amount > 0) {
      line_items.push({
        price_data: {
          currency: "eur",

          product_data: {
            name: "Prepitné"
          },

          unit_amount: tip_amount
        },

        quantity: 1
      })

      // Stores The New Order Item
      order_items.push({
        clothing_id: null,
        quantity: 1,
        price_at_purchase: tip_amount,
        is_tip: true
      })
    }

    if(line_items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Chyba pri spracovaní položiek košíka."
      })
    }

    const tracking_code = Math.random().toString(36).substring(2, 8).toUpperCase() // Generates The Order Tracking Code

    // Saves The New Order
    const new_order = await prisma.order.create({
      data: {
        tracking_code: tracking_code,
        first_name: customer.first_name || "Neznáme",
        last_name: customer.last_name || "Neznáme",
        address: customer.address || "Neznáma",
        city: customer.city || "Neznáme",
        phone_number: customer.phone_number || "Neznáme",
        message: customer.message || null,
        price: discounted_items_price,
        total_price: total_price,
        status: "PENDING",

        items: {
          create: order_items
        }
      }
    })

    const checkout_session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: line_items,
      mode: "payment",
      success_url: `${front_end_domain}platba-uspesna?code=${new_order.tracking_code}`,
      cancel_url: `${front_end_domain}?cancel_order_code=${new_order.tracking_code}`,

      metadata: {
        order_id: new_order.id.toString()
      }
    })

    // Saves The Stripe Intent ID
    await prisma.order.update({
      where: { id: new_order.id },
      data: { stripe_intent_id: checkout_session.id }
    })

    return res.status(200).json({
      success: true,
      message: "Platba prebehla úspešne.",
      url: checkout_session.url
    })
  } 
  
  catch(error) {
    console.error(error) // Shows The Error

    return res.status(500).json({
      success: false,
      message: "Pri spracovávaní platby došlo k chybe."
    })
  }
})

// Creates The Order
app.post("/api/create-order", async (req, res) => {
  try {
    // Checks The Opening Hours

    // Checks If The Boutique Is Open
    if(!isOpen()) {
      return res.status(400).json({
        success: false,
        message: "Objednávky nie je možné uskutočniť, keď je zatvorené."
      })
    }

    // Gets The Data

    const front_end_domain = process.env.FRONT_END_DOMAIN_URL || "http://localhost:5173/" // Gets The Front-End Domain URL

    const items = req.body.cart_items || [] // Gets The Items
    const customer = req.body.customer || {} // Gets The Customer
    const coupon_code = req.body.applied_coupon || null // Gets The Coupon Code

    // Calculates The Price

    let discount_percent = 0 // Stores The Discount Percent

    if(coupon_code) {
      // Gets The Active Coupon
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: { equals: coupon_code.trim(), mode: "insensitive" },
          is_active: true
        }
      })

      if(coupon && (!coupon.valid_until || coupon.valid_until > new Date())) discount_percent = coupon.discount_percent // Sets The Discount Percent
    }

    let raw_items_price = 0 // Stores The Price In Cents Without The Discount

    for(const one_item of items) {
      const item_price = parseInt(one_item.price || "0", 10) // Gets The Item Price
      const item_quantity = parseInt(one_item.quantity || "1", 10) // Gets The Item Quantity

      raw_items_price += item_price * item_quantity 
    }

    const discount_amount = discount_percent > 0 ? Math.floor(raw_items_price * (discount_percent / 100)) : 0 // Stores The Discount Amount
    const discounted_items_price = raw_items_price - discount_amount // Stores The Discounted Items Price
    const total_price = discounted_items_price // Gets The Total Price

    if(!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Objednávku nie je možné uskutočniť bez položiek v košíku."
      })
    }

    const order_items = [] // Stores The DB Order Items
    const discount_multiplier = discount_percent > 0 ? (100 - discount_percent) / 100 : 1.0 // Gets The Discount Multiplayer (10% = 0.9)

    for(const one_item of items) {
      const item_id = parseInt(one_item.id, 10) // Gets The Item ID
      const original_unit_price = parseInt(one_item.price || "0", 10) // Gets The Original Price
      const quantity = parseInt(one_item.quantity || "1", 10) // Gets The Quantity
      const final_unit_price = Math.round(original_unit_price * discount_multiplier) // Applies The Discount On The Clothing

      // Stores The New Order Item
      order_items.push({
        clothing_id: item_id,
        quantity: quantity,
        price_at_purchase: final_unit_price,
        is_tip: false
      })
    }

    if(order_items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Chyba pri spracovaní položiek košíka."
      })
    }

    const tracking_code = Math.random().toString(36).substring(2, 8).toUpperCase() // Generates The Order Tracking Code

    // Saves The New Order
    const new_order = await prisma.order.create({
      data: {
        tracking_code: tracking_code,
        first_name: customer.first_name || "Neznáme",
        last_name: customer.last_name || "Neznáme",
        address: customer.address || "Neznáma",
        city: customer.city || "Neznáme",
        phone_number: customer.phone_number || "Neznáme",
        message: customer.message || null,
        price: discounted_items_price,
        total_price: total_price,
        status: "PREPARING",
        cash_on_delivery: true,

        items: {
          create: order_items
        }
      }
    })

    return res.status(200).json({
      success: true,
      message: "Objednávka bola prijatá.",
      tracking_code: new_order.tracking_code,
      url: `${front_end_domain}objednavka-uspesna?code=${new_order.tracking_code}`
    })
  } 
  
  catch(error) {
    console.error(error) // Shows The Error

    return res.status(500).json({
      success: false,
      message: "Pri spracovávaní objednávky došlo k chybe."
    })
  }
})

// Cancels The Order
app.post("/api/cancel-order/:tracking_code", async (req, res) => {
  try {
    const tracking_code = req.params.tracking_code // Gets The Tracking Code From URL

    // Gets The Order
    const order = await prisma.order.findFirst({
      where: {
        tracking_code: tracking_code.toUpperCase(),
        status: "PENDING"
      }
    })

    if(!order) {
      return res.status(404).json({
        success: false, 
        message: "Objednávku sa nepodarilo nájsť."
      })
    }

    // Updates And Saves The Order Status
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" }
    })

    return res.status(200).json({
      success: true, 
      message: "Objednávka bola zrušená."
    })
  } 
  
  catch(error) {
    console.error(error) // Shows The Error

    return res.status(500).json({
      success: false,
      message: "Pri rušení objednávky došlo k chybe."
    })
  }
})

// Gets The Order Status
app.get("/api/order-status/:tracking_code", async (req, res) => {
  try {
    const tracking_code = req.params.tracking_code // Gets The Tracking Code From URL

    // Gets The Order
    const order = await prisma.order.findFirst({
      where: {
        tracking_code: tracking_code.toUpperCase()
      }
    })

    if(!order) {
      return res.status(404).json({
        success: false, 
        message: "Objednávku sa nepodarilo nájsť."
      })
    }
    
    return res.status(200).json({
      success: true, 
      message: "Objednávka bola nájdená.",
      order_details: order
    })
  } 
  
  catch(error) {
    console.error(error) // Shows The Error

    return res.status(500).json({
      success: false,
      message: "Pri hľadaní objednávky došlo k chybe."
    })
  }
})

// Gets The Ordered Items
app.post("/api/ordered-items/:id", async (req, res) => { // Zmenené z POST na GET
  try {
    const id = parseInt(req.params.id) // Gets The ID From URL

    if(isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Objednávku sa nepodarilo nájsť."
      })
    }

    const items = await prisma.orderItem.findMany({
      where: {
        order_id: id,
        is_tip: false
      },

      include: {
        clothing: true
      }
    })

    const all_ratings = await prisma.rating.findMany({
      where: {
        order_id: id
      }
    })

    // Creates Valid Format Of Ordered Items For JSON Response
    const ordered_items = items
      .filter(one_item => one_item.clothing)
      .map(one_item => {
        const selected_rating = all_ratings.find(one_rating => one_rating.clothing_id === one_item.clothing.id) // Gets The Selected Rating

        return {
          id: one_item.clothing.id,
          title: one_item.clothing.title,
          description: one_item.clothing.description,
          price: one_item.price_at_purchase,
          quantity: one_item.quantity,
          image: one_item.clothing.image ? one_item.clothing.image : null,
          selected_rating: selected_rating ? selected_rating.rating : 0
        }
      })
    
    return res.status(200).json({
      success: true, 
      message: "Položky boli nájdené.",
      ordered_items: ordered_items
    })
  } 
  
  catch(error) {
    console.error(error) // Shows The Error

    return res.status(500).json({
      success: false,
      message: "Pri hľadaní položiek objednávky došlo k chybe."
    })
  }
})

// Sends The Rating
app.post("/api/send-rating", async (req, res) => {
  try {
    const { tracking_code, all_ratings } = req.body // Gets The Data

    if(!tracking_code || !all_ratings || all_ratings.length === 0) {
      return res.status(400).json({
        success: false, 
        message: "Pri pridávaní hodnotenia došlo k chybe."
      })
    }

    // Gets The Order
    const order = await prisma.order.findFirst({
      where: {
        tracking_code: tracking_code.toUpperCase(),
        status: "COMPLETED"
      }
    })

    if(!order) {
      return res.status(404).json({
        success: false, 
        message: "Objednávka neexistuje alebo ešte nebola doručená."
      })
    }

    for(const one_item of all_ratings) {
      const clothing_id = one_item.clothing_id // Gets The Clothing ID
      const rating = one_item.rating // Gets The Rating

      // Gets The Alreasy Existing Rating
      const existing_rating = await prisma.rating.findFirst({
        where: {
          order_id: order.id,
          clothing_id: clothing_id
        }
      })

      // Creates Or Updates The Rating
      if(existing_rating) {
        await prisma.rating.update({
          where: { id: existing_rating.id },
          data: { rating: rating }
        })
      } 
      
      else {
        await prisma.rating.create({
          data: {
            order_id: order.id,
            clothing_id: clothing_id,
            rating: rating
          }
        })
      }
    }

    return res.status(200).json({
      success: true, 
      message: "Hodnotenia boli úspešne odoslané."
    })

  } 
  
  catch(error) {
    console.error(error) // Shows The Error

    return res.status(500).json({
      success: false, 
      message: "Pri pridávaní hodnotenia došlo k chybe."
    })
  }
})

// Sends The Message
app.post("/api/contact", async (req, res) => {
  try {
    const { first_name, last_name, email_address, message } = req.body // Gets The Data

    // If The Contact Form Isn't Filled
    if(!first_name || !last_name || !email_address || !message) {
      return res.status(400).json({
        success: false,
        message: "Prosím, vyplňte všetky povinné kontaktné údaje pre odoslanie správy."
      })
    }

    // Saves The New Message
    await prisma.contactMessage.create({
      data: {
        first_name: first_name,
        last_name: last_name,
        email_address: email_address,
        message: message
      }
    })

    // Sends Mail
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT, 
      secure: true, // True For PORT 465, False For PORT 587

      auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD
      }
    })

    const subject = "Butik - správa od zákazníka"
    const text_content = `${first_name} ${last_name} - ${email_address}\n\n${message}`;

    const html_content = `
        <p>
            <b>${first_name} ${last_name} - ${email_address}</b><br><br>
            ${message}
        </p>
    `

    await transporter.sendMail({
      from: process.env.EMAIL_HOST_USER,
      replyTo: email_address,
      to: process.env.EMAIL_HOST_USER,
      subject: subject,
      text: text_content,
      html: html_content
    })
    
    return res.status(200).json({
      success: true, 
      message: "Správa bola odoslaná."
    })
  } 
  
  catch(error) {
    console.error(error) // Shows The Error

    return res.status(500).json({
      success: false,
      message: "Pri odosielaní správy došlo k chybe."
    })
  }
})

// Validates The Coupon
app.post("/api/validate-coupon", async (req, res) => {
  try {
    const { coupon_code } = req.body // Gets The Coupon Code

    if(!coupon_code) {
      return res.status(500).json({
        success: false,
        message: "Zadajte kód kupónu."
      })
    }

    // Gets The Coupon
    const coupon = await prisma.coupon.findUnique({
      where: {
        code: coupon_code.toUpperCase()
      }
    })

    if(!coupon || !coupon.is_active) {
      return res.status(400).json({
        success: false,
        message: "Kupón nie je platný."
      })
    }

    const now = new Date() // Gets The Current Time

    if(coupon.valid_until && coupon.valid_until < now) {
      return res.status(400).json({
        success: false,
        message: "Platnosť zadaného kupónu už vypršala."
      })
    }

    return res.status(200).json({
      success: true,
      message: "Kupón bol úspešne uplatnený!",
      code: coupon.code,
      discount_percent: coupon.discount_percent
    })
  } 

  catch(error) {
    console.error(error) // Shows The Error

    return res.status(500).json({
      success: false,
      message: "Pri overovaní kupónu došlo k chybe."
    })
  }
})

// Starts The Server
app.listen(5000, () => {
  console.log("Back-End is running on: http://localhost:5000")
})