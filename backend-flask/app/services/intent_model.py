from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

class IntentModel:

    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.model = LogisticRegression()

        # minimal training data
        X = [
            "remove this trait",
            "delete calm",
            "add creativity",
            "include more emotion",
            "change this",
            "edit identity"
        ]

        y = [
            "REJECT",
            "REJECT",
            "ADD",
            "ADD",
            "UPDATE",
            "UPDATE"
        ]

        X_vec = self.vectorizer.fit_transform(X)
        self.model.fit(X_vec, y)

    def predict(self, text):
        vec = self.vectorizer.transform([text])
        return self.model.predict(vec)[0]


intent_model = IntentModel()