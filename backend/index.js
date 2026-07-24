const express = require("express")
const cors = require("cors")
const { PrismaClient } = require("@prisma/client")

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static("uploads"))

// Gets The Clothing From The DB
app.get("/api/clothing", async(req, res) => {
  try {
    // Gets The Clothing
    const clothing = await prisma.clothing.findMany({
      include: {
        category: true
      },
    })
    
    res.json(clothing) // Returns The Found Clothing
  } 
  
  catch(error) {
    console.error(error) // Shows The Error
    res.status(500).json({ error: "Pri načítaní položiek došlo k chybe." })
  }
})

// Gets All Cart Items
app.post("/api/cart-items", async(req, res) => {
  try {
    const { ids } = req.body // Gets The Array Of IDs

    if(!ids || !Array.isArray(ids) || ids.length === 0) return res.json([]) // Returns An Empty Array

    // Gets The Clothing
    const clothing = await prisma.clothing.findMany({
      where: {
        id: { in: ids }
      },

      include: {
        category: true
      }
    })

    res.json(clothing) // Returns The Found Clothing
  } 
  
  catch(error) {
    console.error(error) // Shows The Error
    res.status(500).json({ error: "Pri načítaní položiek došlo k chybe." })
  }
})

// Validates The Coupon
app.post("/api/validate-coupon", async (req, res) => {
  try {
    const { coupon_code } = req.body // Gets The Coupon Code

    if(!coupon_code) {
      return res.json({
        success: false,
        message: "Kupón nie je platný."
      }, 500)
    }

    // Gets The Coupon
    const coupon = await prisma.coupon.findUnique({
      where: {
        code: coupon_code
      }
    })

    if(!coupon || !coupon.is_active) {
      return res.json({
        success: false,
        message: "Kupón nie je platný."
      }, 400)
    }

    const now = new Date() // Gets The Current Time

    if(coupon.valid_until && coupon.valid_until < now) {
      return res.json({
        success: false,
        message: "Platnosť zadaného kupónu už vypršala."
      }, 400)
    }

    return res.json({
      success: true,
      message: "Kupón bol úspešne uplatnený!",
      code: coupon.code,
      discount_percent: coupon.discount_percent
    }, 200)
  } 
  
  catch (error) {
    console.error(error); // Shows The Error
    res.status(500).json({ error: "Pri overovaní kupónu došlo k chybe." })
  }
})

// Starts The Server
app.listen(5000, () => {
  console.log("Back-End is running on: http://localhost:5000")
})