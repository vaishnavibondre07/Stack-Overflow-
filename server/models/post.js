import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    content: { type: String, required: true },
    image: { type: String },
    video: { type: String },
    userid: { type: String, required: true },
    username: { type: String, required: true },
    likes: { type: [String], default: [] },
    comments: [
      {
        commentbody: { type: String, required: true },
        userid: { type: String, required: true },
        username: { type: String, required: true },
        commentedon: { type: Date, default: Date.now },
      },
    ],
    shares: { type: Number, default: 0 },
    postedon: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("post", postSchema);

