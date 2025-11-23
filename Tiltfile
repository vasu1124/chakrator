docker_build('chakrator', '.')

k8s_yaml('deploy/crd.yaml')
k8s_yaml('deploy/rbac.yaml')
k8s_yaml('deploy/deployment.yaml')
k8s_yaml('deploy/service.yaml')

k8s_resource('chakrator', port_forwards='3000:3000')
