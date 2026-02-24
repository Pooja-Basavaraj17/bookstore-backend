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
                    sh '''
                    /var/jenkins_home/tools/hudson.plugins.sonar.SonarRunnerInstallation/SonarScanner/bin/sonar-scanner \
                    -Dsonar.projectKey=bookstore-app \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=http://host.docker.internal:8081 \
                    -Dsonar.login=sqa_7df9fa7e1fff70ebcd6bf5e23ddd63f9345a4c16
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
