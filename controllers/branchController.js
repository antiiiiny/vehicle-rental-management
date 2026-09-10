const Branch = require('../models/Branch');
const { ApiError } = require('../middleware/errorHandler');

async function createBranch(req, res, next) {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({ success: true, message: 'Branch created', data: { branch } });
  } catch (err) {
    next(err);
  }
}

async function listBranches(req, res, next) {
  try {
    const branches = await Branch.find().sort({ name: 1 });
    res.json({ success: true, message: 'OK', data: { branches } });
  } catch (err) {
    next(err);
  }
}

async function getBranch(req, res, next) {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) throw new ApiError(404, 'Branch not found', 'NOT_FOUND');
    res.json({ success: true, message: 'OK', data: { branch } });
  } catch (err) {
    next(err);
  }
}

async function updateBranch(req, res, next) {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!branch) throw new ApiError(404, 'Branch not found', 'NOT_FOUND');
    res.json({ success: true, message: 'Branch updated', data: { branch } });
  } catch (err) {
    next(err);
  }
}

async function deleteBranch(req, res, next) {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) throw new ApiError(404, 'Branch not found', 'NOT_FOUND');
    res.json({ success: true, message: 'Branch deleted', data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { createBranch, listBranches, getBranch, updateBranch, deleteBranch };
