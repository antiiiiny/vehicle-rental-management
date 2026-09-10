function calculateCancellationDetails(booking, cancellationDate = new Date()) {
  const startDate = new Date(booking.startDate);
  const now = new Date(cancellationDate);

  const diffMs = startDate.getTime() - now.getTime();
  const hoursUntilStart = diffMs / (1000 * 60 * 60);

  let feePercentage = 0;
  let policyTier = '';

  if (hoursUntilStart >= 48) {
    feePercentage = 0;
    policyTier = 'Full Refund (Cancelled >= 48 hours before pickup)';
  } else if (hoursUntilStart >= 24) {
    feePercentage = 0.20;
    policyTier = '80% Refund (Cancelled between 24 and 48 hours before pickup)';
  } else if (hoursUntilStart > 0) {
    feePercentage = 0.50;
    policyTier = '50% Refund (Cancelled less than 24 hours before pickup)';
  } else {
    feePercentage = 1.00;
    policyTier = 'No Refund (Cancellation requested after pickup start date)';
  }

  const totalAmount = booking.totalAmount || 0;
  const cancellationFee = Number((totalAmount * feePercentage).toFixed(2));
  const refundAmount = Number(Math.max(0, totalAmount - cancellationFee).toFixed(2));

  return {
    hoursUntilStart: Number(hoursUntilStart.toFixed(1)),
    feePercentage: feePercentage * 100,
    cancellationFee,
    refundAmount,
    policyTier,
    totalAmount,
  };
}

module.exports = {
  calculateCancellationDetails,
};
