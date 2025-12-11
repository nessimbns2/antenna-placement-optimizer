# tabu_antennes_dataset.py
import random
import math
import matplotlib.pyplot as plt

# -----------------------------
# 1) Données (zones + catalogue d'antennes)
# -----------------------------
zones = [
    {"id": 1, "x": 1,   "y": 1,    "users": 50},
    {"id": 2, "x": 54,  "y": 547,  "users": 1},
    {"id": 3, "x": 107, "y": 1093, "users": 5},
    {"id": 4, "x": 160, "y": 1639, "users": 70},
    {"id": 5, "x": 213, "y": 2185, "users": 47},
    {"id": 6, "x": 266, "y": 2731, "users": 53},
    {"id": 7, "x": 319, "y": 3277, "users": 60},
    {"id": 8, "x": 372, "y": 3823, "users": 66},
    {"id": 9, "x": 425, "y": 4369, "users": 73},
    {"id":10, "x": 478, "y": 4915, "users": 79},
]

antenna_types = {
    "Macro": {"coverage": 5000, "capacity": 2000, "cost": 25000},
    "Micro": {"coverage": 2000, "capacity": 500,  "cost": 12000},
    "Pico" : {"coverage": 300,  "capacity": 100,  "cost": 5000},
    "Femto": {"coverage": 50,   "capacity": 20,   "cost": 1000},
}

# Choix pertinents pour ce dataset
BUDGET = 50000
MAX_ANTENNAS = 4

# -----------------------------
# 2) Utilitaires
# -----------------------------
def distance(p, q):
    return math.hypot(p["x"] - q["x"], p["y"] - q["y"])

# Indique si une antenne de type 'atype' placée en site j couvre la zone i
def build_coverage_matrix(zones, antenna_types):
    n = len(zones)
    coverage = [[set() for _ in range(n)] for _ in range(n)]
    # coverage[i][j] contient les types d'antennes qui, si installées en j, couvrent la zone i
    for i in range(n):
        for j in range(n):
            for atype, params in antenna_types.items():
                if distance(zones[i], zones[j]) <= params["coverage"]:
                    coverage[i][j].add(atype)
    return coverage

COV = build_coverage_matrix(zones, antenna_types)

# -----------------------------
# 3) Évaluation d'une solution
# -----------------------------
# solution: liste de tuples (site_index, antenna_type)
# On doit:
# - vérifier budget et nombre max antennes
# - affecter chaque zone à au plus une antenne couvrante, en respectant les capacités
# - retourner le nombre total d'utilisateurs couverts
def eval_solution(solution):
    # contrainte budget / max antennas
    total_cost = sum(antenna_types[atype]["cost"] for (_, atype) in solution)
    if total_cost > BUDGET or len(solution) > MAX_ANTENNAS:
        return 0  # solution infeasible

    n_z = len(zones)
    # capacities restantes par antenne (index dans solution)
    capacities = [antenna_types[atype]["capacity"] for (_, atype) in solution]

    # pour assigner zones, on parcourt chaque zone et on cherche une antenne couvrante
    covered_users = 0
    for i in range(n_z):
        zone_users = zones[i]["users"]
        # liste d'indexes d'antennes dans 'solution' qui couvrent la zone i
        covering_antennas = []
        for a_idx, (site_idx, atype) in enumerate(solution):
            # vérifier si l'antenne placée en site 'site_idx' couvre la zone i
            if atype in COV[i][site_idx]:
                covering_antennas.append(a_idx)
        if not covering_antennas:
            continue  # zone non couverte
        # choisir l'antenne couvrante avec le plus de capacité restante (heuristique simple)
        covering_antennas.sort(key=lambda idx: capacities[idx], reverse=True)
        chosen = None
        for a_idx in covering_antennas:
            if capacities[a_idx] >= zone_users:
                chosen = a_idx
                break
        # si aucune antenne n'a assez de capacité pour couvrir toute la zone,
        # tu peux décider de:
        #  - ne pas couvrir la zone (ici on ne couvre pas partiellement)
        #  - ou allouer partiellement (complexe)
        if chosen is not None:
            capacities[chosen] -= zone_users
            covered_users += zone_users
        # sinon on skip (zone non couverte)
    return covered_users

# -----------------------------
# 4) Génération de voisins
# -----------------------------
def generate_neighbors(solution):
    neighbors = []
    n_sites = len(zones)
    used_sites = {s for (s, _) in solution}

    # 1) Ajouter une antenne sur un site vide (tous types)
    for j in range(n_sites):
        if j not in used_sites:
            for t in antenna_types:
                new_sol = solution.copy()
                new_sol.append((j, t))
                neighbors.append(new_sol)

    # 2) Supprimer une antenne (tous les indices)
    for i in range(len(solution)):
        new_sol = solution.copy()
        new_sol.pop(i)
        neighbors.append(new_sol)

    # 3) Changer le type d'une antenne existante
    for i in range(len(solution)):
        site_idx, old_type = solution[i]
        for t in antenna_types:
            if t != old_type:
                new_sol = solution.copy()
                new_sol[i] = (site_idx, t)
                neighbors.append(new_sol)

    return neighbors

# -----------------------------
# 5) Tabu Search
# -----------------------------
def tabu_search(iterations=100, tabu_size=15):
    # initialisation: solution aléatoire plausible
    current_solution = []
    # démarrer avec 1 à MAX_ANTENNAS antennes aléatoires (sites distincts)
    k0 = random.randint(1, min(MAX_ANTENNAS, len(zones)))
    available_sites = list(range(len(zones)))
    random.shuffle(available_sites)
    for idx in available_sites[:k0]:
        atype = random.choice(list(antenna_types.keys()))
        current_solution.append((idx, atype))

    best_solution = current_solution.copy()
    best_score = eval_solution(best_solution)
    tabu_list = []

    for it in range(iterations):
        neighbors = generate_neighbors(current_solution)
        # filtrer voisins qui sont identiques à une solution taboue
        neighbors = [n for n in neighbors if n not in tabu_list]
        if not neighbors:
            break
        # évaluer voisins
        scores = [eval_solution(n) for n in neighbors]
        max_idx = scores.index(max(scores))
        next_solution = neighbors[max_idx]
        next_score = scores[max_idx]

        # mise à jour liste tabou (on stocke la solution choisie)
        tabu_list.append(next_solution)
        if len(tabu_list) > tabu_size:
            tabu_list.pop(0)

        current_solution = next_solution

        if next_score > best_score:
            best_score = next_score
            best_solution = next_solution.copy()

        # affichage pour suivi
        print(f"Iter {it+1}: Best users covered = {best_score}")

    return best_solution, best_score

# -----------------------------
# 6) Exécution
# -----------------------------
if __name__ == "__main__":
    best_sol, best_users = tabu_search(iterations=80, tabu_size=12)
    print("\nMeilleure solution (site_index, antenna_type):", best_sol)
    print("Nombre d'utilisateurs couverts:", best_users)

    # -----------------------------
    # 7) Visualisation simple
    # -----------------------------
    x = [z["x"] for z in zones]
    y = [z["y"] for z in zones]
    colors = []
    for idx, z in enumerate(zones):
        if idx in [site for (site, _) in best_sol]:
            colors.append('red')
        else:
            colors.append('blue')

    plt.figure(figsize=(6,6))
    plt.scatter(x, y, c=colors, s=100)
    for i, z in enumerate(zones):
        plt.text(z["x"]+3, z["y"]+3, f"{z['id']}({z['users']})", fontsize=9)
    plt.title("Sites (rouge = antenne installée)")
    plt.xlabel("x")
    plt.ylabel("y")
    plt.grid(True)
    plt.show()
