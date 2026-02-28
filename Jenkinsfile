pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'docker build -t bookstore-app .'
            }
        }

        stage('SonarQube Analysis') {
    steps {
        withSonarQubeEnv('SonarQube') {
            script {
                def scannerHome = tool 'SonarScanner'
                sh """
                ${scannerHome}/bin/sonar-scanner \
                -Dsonar.projectKey=bookstore-app \
                -Dsonar.sources=. \
                -Dsonar.host.url=http://sonarqube:9000
                """
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
