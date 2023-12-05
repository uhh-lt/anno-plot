# Anno Plot

## Demo
https://github.com/bruehldev/Code-Graph-Backend/assets/15344369/faf1d89a-28cc-4416-a649-0567688ec25a


This is a monorepo combining the repositories

- Backend: https://github.com/bruehldev/Code-Graph-Backend
- Frontend: https://github.com/jsp1999/Code-Graph-Frontend

# Anno-Plot-Backend

This is a FastAPI-based API that provides topic modeling and sentence embedding functionalities using BERT models. The API supports NER dataset like `few_nerd`. 


## Requirements
- Conda for package management
- Ensure you have an NVIDIA GPU with the required drivers:
  ```
  nvidia-smi
  ```
- Install the build-essential packages:
  ```
  sudo apt update
  sudo apt install build-essential
  ```
- PostgreSQL as database.
  - Follow the official PostgreSQL download instructions [here](https://www.postgresql.org/download/).
  - Use the following command to check if PostgreSQL is installed:
    ```
    which psql
    ```
- Setting Up PostgreSQL Database:
  - Access the PostgreSQL prompt:
    ```
    sudo -u postgres psql
    ```
    Create a new user (replace password):
    ```
    CREATE USER admin WITH PASSWORD 'password';
    ```
    Create Database:
    ```
    CREATE DATABASE annoplot OWNER admin;
    ```
    Grant Privileges:
    ```
    GRANT ALL PRIVILEGES ON DATABASE annoplot TO admin;
    ```
    Exit Prompt:
    ```
    \q
    ```
- Adapt environment ([env.json](https://github.com/uhh-lt/anno-plot/blob/main/backend/env.json)) if necessary    

## Usage

1. Install the required packages by running the following command:
  - Create:
    ```
    conda env create --name AnnoPlot --file environment.yml
    ```
  - Activate:
    ```
    conda activate AnnoPlot
    ```

2. Start the server using the following command:
```
cd src
uvicorn main:app --reload
```

3. Once the server is running, you can access the API at `http://localhost:8000`.

4. API Endpoints:
To access the API documentation use:

[http://localhost:8000/docs](http://localhost:8000/docs)


## Datasets
Datasets used by us can be found in the datasets folder:
- movie datasets:
  - from: https://github.com/juand-r/entity-recognition-datasets/tree/master/data/MITMovieCorpus
  - normal dataset: movie_ner.txt
  - movie dataset german labels (demo): movie_ner_renamed_german.txt
  - movie dataset english labels (demo): movie_ner_renamed.txt
  - huggingface model which worked well for us: dbmdz/bert-large-cased-finetuned-conll03-english
- few-ner datasets:
  - from: https://www.kaggle.com/datasets/nbroad/fewnerd
  - small: few_ner_small.txt
  - medium: dev.txt
  - huggingface model which worked well for us: dbmdz/bert-large-cased-finetuned-conll03-english
- bio-ner datasets:
  - from: https://github.com/juand-r/entity-recognition-datasets/tree/master/data/AnEM
  - normal: bio_ner.txt
  - huggingface model which worked well for us: d4data/biomedical-ner-all
- german datasets:
  - from: https://github.com/davidsbatista/NER-datasets/tree/master/GermEval2014
  - test: NER_de_test.txt
  - train: NER_de_train.txt
  - huggingface model which worked well for us: mschiesser/ner-bert-german


## Contributing

Contributions are welcome! If you have any suggestions, improvements, or bug fixes, please submit a pull request.

## License

This project is licensed under the [Apache License, Version 2.0](LICENSE).


## Folder Structure
```
The project follows the following folder structure:
project/
├─ src/
│ ├─ main.py
│ ├─ module
│ │ └─ routes.py
│ │ └─ service.py
│ │ └─ schema.py
│ ├─ ...
├─ exported/ 
├─ .gitignore
├─ environment.yml
├─ ...
```

- `exported/`: .Used to store generated data
- `.gitignore`: Specifies files and folders to exclude from version control.
- `main.py`: The main entry point of the application.


# Anno-Plot-Frontend

This is a Next.js-based web application used to display annotations and their clusters. 

## Requirements

Ensure that a version of Node.js is installed:

```bash
npm -v
```

otherwise it can be downloaded [here](https://nodejs.org/de/download).

## Getting Started

First, ensure that you are in the frontend directory:

```bash
cd frontend
```

Then, install packages:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Or, run build and run the production server:

```bash
npm run build
```

```bash
npm run start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

For full functionality ensure that the backend is running.

## License

This project is licensed under the [Apache License, Version 2.0](LICENSE).
