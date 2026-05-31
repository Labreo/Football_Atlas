import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`⚽ Football Atlas API Server running on port ${PORT}`);
});
