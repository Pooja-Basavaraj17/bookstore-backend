pipeline {
    agent any

    tools {
        sonarQubeScanner 'SonarScanner'
    }

    stages {

        stage('Build') {
            steps {
                sh 'docker build -t bookstore-app .'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                    sonar-scanner \
                    -Dsonar.projectKey=bookstore-app \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=http://host.docker.internal:8081
                    '''
                }
            }
        }

        stage('Run') {
            steps {
                sh 'docker run -d -p 3000:3000 bookstore-app || true'
            }
        }
    }
}
