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
    const clothing = await prisma.clothing.findMany({
      include: {
        category: true,
      },
    })
    
    res.json(clothing)
  } 
  
  catch(error) {
    console.error(error) // Shows The Error
    res.status(500).json({ error: "Pri načítaní položiek došlo k chybe." })
  }
})

// Starts The Server
app.listen(5000, () => {
  console.log("Back-End is running on: http://localhost:5000")
})