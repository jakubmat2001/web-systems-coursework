import Quote from './quote.model.js';
import errorHandler from './dbErrorHandler.js';
import { calculateBudget } from './calc_budget.js';


const create = async (req, res) => {
  const { employeeName, workHours, workerType, humanResources } = req.body;
  const empId = req.profile._id;
  
  const budget = calculateBudget(workHours, workerType, humanResources);

  //if human resources from our form are null, set the value to 0 as default
  //add the human resources to the budget if any
  const quote = new Quote({
    employeeName,
    workHours,
    workerType,
    humanResources: humanResources || 0, 
    budget: budget,
    empId,
  });

  try {
    await quote.save();
    console.log("saving quote")
    res.status(200).json({ message: 'Quote created successfully', quote });
  } catch (err) {
    res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
};

//this fucntion is to display all the quotes in our project.js and view-only-project.js
const list = async (req, res) => {
  try {
    const quotes = await Quote.find().populate('empId', 'name email');
    res.json(quotes);
  } catch (err) {
    res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
};

//updates the employees quote that lives in the database
const update = async (req, res) => {
  try {
    let quote = await Quote.findById(req.params.quoteId);
    if (!quote) {
      return res.status(400).json({
        error: "Quote not found",
      });
    }

    //attached the employeeId to the request object
    req.quoteEmployeeId = quote.empId;

    //ensure we update our budget upon new values being entered
    const updatedBudget = calculateBudget(req.body.workHours, req.body.workerType, req.body.humanResources);
    quote.budget = updatedBudget;
    quote = Object.assign(quote, req.body);
    quote.updated = Date.now();

    await quote.save();
    res.status(200).json(quote);

  } catch (err) {
    console.error('Update quote error:', err);
    res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
  
};

//read a single quote
const read = (req, res) => {
  return res.json(req.quote);
};

//removes the quote fron our database
const remove = async (req, res) => {
  console.log("Remove quote: ", req.quote); 

  try {
    let quote = req.quote;
    let deletedQuote = await Quote.deleteOne({ _id: quote._id });
    console.log("Deleted quote: ", deletedQuote);
    res.status(200).json({ message: 'Quote deleted successfully', deletedQuote });
  } catch (err) {
    console.log("Remove quote error: ", err);
    res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
};

//searches for a quote with a given id and adds on the employees id/email onto it to check it
//it is used to handle any route which will use /api/quotes/:quoteId' functionalites to remove/update quotes
const quoteByID = async (req, res, next, id) => {
  console.log("quoteByID: ", id);
  try {
    let quote = await Quote.findById(id).populate('empId', 'name email');
    console.log("Quote fetched: ", quote);
    if (!quote)
      return res.status(400).json({ error: 'Quote not found' });
    req.quote = quote;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Could not retrieve quote' });
  }
};

export default { create, list, quoteByID, update, remove, read };
