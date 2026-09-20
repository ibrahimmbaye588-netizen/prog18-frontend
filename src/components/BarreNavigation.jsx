import { NavLink } from "react-router-dom";

const ELEMENTS = [
  { chemin: "/tableau-de-bord", icone: "🏠", libelle: "Accueil" },
  { chemin: "/ventes", icone: "🛒", libelle: "Ventes" },
  { chemin: "/catalogue", icone: "📦", libelle: "Produits" },
  { chemin: "/clients", icone: "👥", libelle: "Clients" },
  { chemin: "/menu", icone: "☰", libelle: "Menu" },
];

export default function BarreNavigation() {
  return (
    <nav className="barre-navigation">
      {ELEMENTS.map((el) => (
        <NavLink
          key={el.chemin}
          to={el.chemin}
          className={({ isActive }) => "element-nav" + (isActive ? " element-nav-actif" : "")}
        >
          <span className="icone-nav">{el.icone}</span>
          <span className="libelle-nav">{el.libelle}</span>
        </NavLink>
      ))}
    </nav>
  );
}
