import mongoose from "mongoose";

const blockSchema = new mongoose.Schema({
  type: { type: String },
  block_id: { type: String },
  elements: { type: Array },
});

const schema = new mongoose.Schema(
  {
    client_msg_id: { type: String },
    user: { type: String },
    type: { type: String },
    ts: { type: String },
    text: { type: String },
    team: { type: String },
    blocks: [blockSchema],
    channel: { type: String },
    event_ts: { type: String },
    channel_type: { type: String },
  },
  { timestamps: true }
);

const Reports = mongoose.model("reports", schema);
export default Reports;
