import ImageEditor from '../components/ImageEditor';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Verticey Editor</h1>
        <ImageEditor />
      </div>
    </div>
  );
}
