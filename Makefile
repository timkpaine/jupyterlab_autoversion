PIP := pip
PYTHON := python
YARN := jlpm

testjs: ## Clean and Make js tests
	cd js; ${YARN} test

testpy: ## Clean and Make unit tests
	${PYTHON} -m pytest -v jupyterlab_autoversion/tests --cov=jupyterlab_autoversion

tests: lint ## run the tests
	${PYTHON} -m pytest -v jupyterlab_autoversion/tests --cov=jupyterlab_autoversion --junitxml=python_junit.xml --cov-report=xml --cov-branch
	cd js; ${YARN} test

lint: ## run linter
	${PYTHON} -m flake8 jupyterlab_autoversion setup.py
	cd js; ${YARN} lint

fix:  ## run autopep8/tslint fix
	${PYTHON} -m autopep8 --in-place -r -a -a jupyterlab_autoversion/
	cd js; ${YARN} fix

annotate: ## MyPy type annotation check
	${PYTHON} -m mypy jupyterlab_autoversion

annotate_l: ## MyPy type annotation check - count only
	${PYTHON} -m mypy jupyterlab_autoversion | wc -l

clean: ## clean the repository
	find . -name "__pycache__" | xargs  rm -rf
	find . -name "*.pyc" | xargs rm -rf
	find . -name ".ipynb_checkpoints" | xargs  rm -rf
	rm -rf .coverage coverage coverage.xml cover htmlcov python_junit.xml logs build dist lab-dist *.egg-info
	cd js; rm -rf node_modules lib package-lock.json yarn.lock tsconfig.tsbuildinfo
	# make -C ./docs clean

dev_install: ## set up the repo for active development
	${PIP} install -e .[dev] --install-option=--skip-npm
	make labextension
	# verify
	${PYTHON} -m jupyter serverextension list
	${PYTHON} -m jupyter labextension list

docs:  ## make documentation
	make -C ./docs html
	open ./docs/_build/html/index.html

install:  ## install to site-packages
	${PIP} install .

serverextension: install ## enable serverextension
	${PYTHON} -m jupyter serverextension enable --py jupyterlab_autoversion

jslib:  ## build javascript; this task cannot have the same name as the js dir
	cd js; ${YARN}
	cd js; ${YARN} build

labextension: jslib ## enable labextension
	cd js; ${PYTHON} -m jupyter labextension install .

dist: jslib  ## create dists
	rm -rf dist build
	${PYTHON} setup.py sdist bdist_wheel

publish: dist  ## dist to pypi and npm
	${PYTHON} -m twine check dist/* && twine upload dist/*
	cd js; npm publish

init_debug:  ## make launch.json from template for debugging in vscode
	cp .vscode/jupyterlab_venv.env.template .vscode/jupyterlab_venv.env
	cp .vscode/launch.json.template .vscode/launch.json

# Thanks to Francoise at marmelab.com for this
.DEFAULT_GOAL := help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

print-%:
	@echo '$*=$($*)'

.PHONY: clean install serverextension labextension test tests help docs dist
