const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
app.use(cors()); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect('mongodb://localhost:27017/foodshare', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

const foodSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  qty_amt: { type: Number, required: true },
  qty_type: { type: String, required: true },
  cook_time: { type: Date, required: true },
  condition: { type: String, required: true },
  contact: { type: String, required: true },
  exptime: { type: Date, required: true },
  available: { type: Boolean, default: true }
});


const Food = mongoose.model('Food', foodSchema);
app.post('/api/postFood', async (req, res) => {
  try {
    const { fname, qty_amt, qty_type, cook_time, condition, contact, exptime } = req.body;
    const foodPost = new Food({ fname, qty_amt, qty_type, cook_time, condition, contact, exptime });
    await foodPost.save();
    res.status(201).json({ message: 'Food posted successfully', foodPost });
  } catch (error) {
    res.status(400).json({ error: 'Failed to post food', message: error.message });
  }
});
app.get('/api/getFood', async (req, res) => {
  try {
    const foodPosts = await Food.find({   exptime: { $gte: new Date() },
  available: true
});
    const dataWithTags = foodPosts
      .map(item => {
        const now = new Date();
        const cookTime = new Date(item.cook_time);
        const expTime = new Date(item.exptime);
        const totalDuration = expTime - cookTime;
        const displayUntil = new Date(cookTime.getTime() + (2 / 3) * totalDuration);
        if (now > displayUntil) {
          return null; 
        }
        const cookedHoursAgo = Math.round((now - cookTime) / 3600000);
        const expiresInHours = Math.round((expTime - now) / 3600000);
        let conditionClass = 'good'; // default
        if (cookedHoursAgo < 4 && expiresInHours > 6) {
          conditionClass = 'fresh';
        } else if (expiresInHours < 6) {
          conditionClass = 'about-to-expire';
        }
        return {
          ...item.toObject(),
          conditionClass
        };
      })
      .filter(Boolean);
    res.status(200).json(dataWithTags);
  } catch (error) {
    res.status(400).json({ error: 'Failed to get food posts', message: error.message });
  }
});
app.put('/api/consumeFood/:id', async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, { available: false }, { new: true } );
    if (!food) {
      return res.status(404).json({ error: 'Food item not found' });
    }
    res.status(200).json({ message: 'Food marked as consumed', food });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update food', message: error.message });
  }
});

app.listen(port, () => { console.log(`Server running on port ${port}`);});
