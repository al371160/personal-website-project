import { useParams } from "react-router-dom";

export default function Detail() {
  const { id } = useParams();

  return (
    <main className="page">
      <h1>Project {id}</h1>
      <p>
        This is where detailed content, images, 3D scenes, or CAD models will
        live.
      </p>
    </main>
  );
}
