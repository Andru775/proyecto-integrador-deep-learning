"""
Linea base: TF-IDF + Regresion Logistica
Proyecto Integrador - Deep Learning
Deteccion de desinformacion politica en espanol: adaptacion al contexto colombiano
Primera entrega - Fase 1

Uso: python baseline.py fake_news_dataset.csv
Requisitos: pandas, scikit-learn, numpy
"""
import re
import sys
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    matthews_corrcoef, confusion_matrix, classification_report
)

SEED = 42


def clean_text(t: str) -> str:
    t = str(t).lower()
    t = re.sub(r"http\S+|www\.\S+", " ", t)
    t = re.sub(r"[^a-záéíóúñü0-9\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def load_dataset(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, sep=";")
    df = df.loc[:, ~df.columns.str.match("Unnamed")]
    # fake_news: True = noticia verdadera, False = noticia falsa (verificado
    # contra los enlaces de verificacion / fact-checkers en link_verificador)
    df["y"] = (df["fake_news"] == True).astype(int)  # 1 = verdadera, 0 = falsa
    df["text"] = (
        df["titulo"].fillna("") + " " + df["texto"].fillna("")
    ).apply(clean_text)
    return df


def main(path: str):
    df = load_dataset(path)
    print(f"Registros: {len(df)} | Falsas: {(df.y == 0).sum()} | "
          f"Verdaderas: {(df.y == 1).sum()}")

    X, y = df["text"], df["y"]
    Xtr, Xte, ytr, yte = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=SEED
    )
    print(f"Train: {len(Xtr)} | Test: {len(Xte)}")

    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2)),
        ("clf", LogisticRegression(
            class_weight="balanced", max_iter=1000, random_state=SEED
        )),
    ])

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    scoring = {"accuracy": "accuracy", "precision": "precision",
               "recall": "recall", "f1": "f1"}
    cv = cross_validate(pipe, Xtr, ytr, cv=skf, scoring=scoring)

    print("\n--- Validacion cruzada (5-fold, sobre el 80% de entrenamiento) ---")
    for metric in scoring:
        vals = cv[f"test_{metric}"]
        print(f"{metric:10s}: media={np.mean(vals):.3f}  "
              f"desv.est={np.std(vals):.3f}")

    pipe.fit(Xtr, ytr)
    pred = pipe.predict(Xte)

    print("\n--- Resultado sobre el conjunto de prueba (20%, held-out) ---")
    print(f"accuracy : {accuracy_score(yte, pred):.3f}")
    print(f"precision: {precision_score(yte, pred):.3f}")
    print(f"recall   : {recall_score(yte, pred):.3f}")
    print(f"f1       : {f1_score(yte, pred):.3f}")
    print(f"mcc      : {matthews_corrcoef(yte, pred):.3f}")
    print("\nMatriz de confusion [filas=real, columnas=prediccion] "
          "orden [Falsa, Verdadera]:")
    print(confusion_matrix(yte, pred))
    print("\n", classification_report(yte, pred, target_names=["Falsa", "Verdadera"]))


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "fake_news_dataset.csv"
    main(path)
