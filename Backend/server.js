const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const User = require('./models/User');  // Your user model
const Feedback = require('./models/Feedback');

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use('/api/auth', authRoutes);

const db1 = mongoose.createConnection('mongodb://user:pass@localhost:27017/db1', { useNewUrlParser: true, useUnifiedTopology: true });

const db2 = mongoose.createConnection('mongodb://user:pass@localhost:27017/db2', { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

// Register a new user
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword
    });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  });

  // Login and generate JWT
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, 'secretKey', { expiresIn: '1h' });
    res.json({ token });
  });

  // Middleware to check for JWT
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      jwt.verify(token, 'secretKey', (err, decodedToken) => {
        if (err) {
          res.status(401).json({ message: 'Invalid token' });
        } else {
          req.userId = decodedToken.userId;
          next();
        }
      });
    } else {
      res.status(401).json({ message: 'No token provided' });
    }
  };

  // Protected route
app.get('/protected', requireAuth, (req, res) => {
    res.json({ message: 'Access granted' });
  });




  // Facility Schema
const FacilitySchema = new mongoose.Schema({
    name: String,
    location: String,
    amenities: [String],
    available: Boolean
  });

  const Facility = mongoose.model('Facility', FacilitySchema);

  // Booking Schema
  const BookingSchema = new mongoose.Schema({
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility' },
    userId: String,
    date: Date,
    status: String
  });
  
  const Booking = mongoose.model('Booking', BookingSchema);
  
  // Fetch all facilities
  app.get('/facilities', async (req, res) => {
    const facilities = await Facility.find();
    res.json(facilities);
  });
  
  // Fetch facility by id
  app.get('/facilities/:id', async (req, res) => {
    const facility = await Facility.findById(req.params.id);
    res.json(facility);
  });
  
  // Book a facility
  app.post('/bookings', async (req, res) => {
    const booking = new Booking(req.body);
    await booking.save();
    res.json(booking);
  });
  
  // Check availability
  app.get('/availability/:facilityId/:date', async (req, res) => {
    const bookingsOnDate = await Booking.find({
      facilityId: req.params.facilityId,
      date: req.params.date
    });
    res.json(bookingsOnDate.length > 0 ? false : true);
  });
  
  const EventSchema = new mongoose.Schema({
    facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility' },
    title: String,
    start: Date,
    end: Date,
    description: String
  });
  
  const Event = mongoose.model('Event', EventSchema);
  
  // API to create an event
  app.post('/events', async (req, res) => {
    const event = new Event(req.body);
    await event.save();
    res.json(event);
  });
  
  // API to update an event
  app.put('/events/:id', async (req, res) => {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(event);
  });
  
  // API to delete an event
  app.delete('/events/:id', async (req, res) => {
    const event = await Event.findByIdAndDelete(req.params.id);
    res.json(event);
  });
  
  // API to get all events
  app.get('/events', async (req, res) => {
    const events = await Event.find();
    res.json(events);
  });

  // API to create an event with availability check
app.post('/events', async (req, res) => {
    const { facility, start, end } = req.body;
    
    // Check if facility is available during the event time
    const existingEvent = await Event.findOne({
      facility,
      $or: [
        { start: { $lte: start }, end: { $gte: start } },
        { start: { $lte: end }, end: { $gte: end } }
      ]
    });
    
    if (existingEvent) {
      return res.status(400).json({ message: 'Facility is not available during this time.' });
    }
  
    const event = new Event(req.body);
    await event.save();
    res.json(event);
  });

  // Maintenance Record Schema
const MaintenanceRecordSchema = new mongoose.Schema({
    facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility' },
    equipment: String,
    lastMaintenance: Date,
    nextMaintenance: Date,
    maintenanceInterval: Number, // in months
    status: String,
    technician: String,
    notes: String
  });
  
  const MaintenanceRecord = mongoose.model('MaintenanceRecord', MaintenanceRecordSchema);
  
  app.post('/maintenance', async (req, res) => {
    const maintenance = new MaintenanceRecord(req.body);
    await maintenance.save();
    res.json(maintenance);
  });
  
  app.get('/maintenance', async (req, res) => {
    const maintenance = await MaintenanceRecord.find();
    res.json(maintenance);
  });
  
  app.put('/maintenance/:id', async (req, res) => {
    const maintenance = await MaintenanceRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(maintenance);
  });
  
  app.delete('/maintenance/:id', async (req, res) => {
    const maintenance = await MaintenanceRecord.findByIdAndDelete(req.params.id);
    res.json(maintenance);
  });

  const stripe = require('stripe')('your_stripe_secret_key');
const jwt = require('jsonwebtoken');

// API to process payment
app.post('/payment', async (req, res) => {
  const { token, amount } = req.body;
  const charge = await stripe.charges.create({
    amount,
    currency: 'usd',
    source: token,
    description: 'Example charge'
  });

  // Save payment details to the database
  const payment = new Payment({
    amount: charge.amount,
    status: charge.status,
    userId: req.user.id
  });
  await payment.save();

  res.json({ message: 'Payment successful', payment });
});

// API to get payment status
app.get('/payment/:id', async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  res.json(payment);
});
// Feedback route
app.post('/feedback', (req, res) => {
    const feedback = new Feedback(req.body);
    feedback.save().then(() => {
      res.json({ message: 'Feedback received' });
    }).catch((error) => {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while saving the feedback' });
    });
  });

  

const PORT = process.env.PORT || 27017;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});